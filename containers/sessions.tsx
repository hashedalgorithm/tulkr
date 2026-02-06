import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ActiveSessions from "@/containers/active-sessions"
import AddSession from "@/containers/add-session"
import Header from "@/containers/header"
import React, { useState } from "react"

type TTabs = "add-session" | "active-sessions"

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
    <div className="flex flex-col gap-4 px-10 py-8">
      <Header />
      <Separator className="w-4/5" />
      <Tabs
        className="justify-end self-end"
        defaultValue={currentSection}
        onValueChange={handleOnChangeSection}>
        <TabsList>
          <TabsTrigger value="add-session">Create</TabsTrigger>
          <TabsTrigger value="active-sessions">Active</TabsTrigger>
        </TabsList>
      </Tabs>
      {currentSection === "add-session" && <AddSession />}
      {currentSection === "active-sessions" && <ActiveSessions />}
    </div>
  )
}

export default Sessions
