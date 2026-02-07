import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ActiveSessions from "@/containers/active-sessions"
import AddSession from "@/containers/add-session"
import Header from "@/containers/header"
import React, { useState } from "react"

export type TTabs = "add-session" | "active-sessions"

const Sessions = () => {
  const [currentSection, setCurrentSection] = useState<TTabs>("add-session")

  const handleOnChangeSection = (value: string) => {
    if (
      value !== ("add-session" satisfies TTabs) &&
      value !== ("active-sessions" satisfies TTabs)
    )
      return

    setCurrentSection(value)
  }

  return (
    <div className="flex w-96 flex-col gap-4 px-6 py-8">
      <Header />
      <Separator className="w-4/5" />
      <Tabs
        className="justify-end self-end"
        value={currentSection}
        onValueChange={handleOnChangeSection}>
        <TabsList>
          <TabsTrigger value="add-session">Create</TabsTrigger>
          <TabsTrigger value="active-sessions">Active</TabsTrigger>
        </TabsList>
      </Tabs>
      {currentSection === "add-session" && <AddSession />}
      {currentSection === "active-sessions" && (
        <ActiveSessions setTab={setCurrentSection} />
      )}
    </div>
  )
}

export default Sessions
